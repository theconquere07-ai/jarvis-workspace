import { useRef, useState, useCallback, useEffect } from 'react';
import { NoteCard } from '../../types';
import { useNotes } from '../../hooks/useNotes';

const LS_BOARD = 'jarvis_board_view';

function loadView(): { x: number; y: number } {
  try {
    const v = localStorage.getItem(LS_BOARD);
    return v ? JSON.parse(v) : { x: 0, y: 0 };
  } catch {
    return { x: 0, y: 0 };
  }
}

function fsz(n: number | null): string {
  if (!n) return '';
  return n > 1e6
    ? (n / 1e6).toFixed(1) + ' MB'
    : Math.max(1, Math.round(n / 1e3)) + ' KB';
}

export function Notesboard() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const [view, setView] = useState(loadView);
  const [panning, setPanning] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const panStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const dragCard = useRef<{ id: string; startX: number; startY: number; cardX: number; cardY: number } | null>(null);
  const resizeCard = useRef<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const saveView = useCallback((v: { x: number; y: number }) => {
    localStorage.setItem(LS_BOARD, JSON.stringify(v));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('#tools')) return;
    const cardEl = (e.target as HTMLElement).closest('.card');
    if (!cardEl) {
      setPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      return;
    }
  };

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (panning && panStart.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        const next = { x: panStart.current.vx + dx, y: panStart.current.vy + dy };
        setView(next);
      }
      if (dragCard.current) {
        const { id, startX, startY, cardX, cardY } = dragCard.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const el = document.getElementById(`card-${id}`);
        if (el) {
          el.style.left = `${cardX + dx}px`;
          el.style.top = `${cardY + dy}px`;
        }
      }
      if (resizeCard.current) {
        const { id, startX, startY, startW, startH } = resizeCard.current;
        const dw = e.clientX - startX;
        const dh = e.clientY - startY;
        const el = document.getElementById(`card-${id}`);
        if (el) {
          el.style.width = `${Math.max(140, startW + dw)}px`;
          el.style.height = `${Math.max(90, startH + dh)}px`;
        }
      }
    },
    [panning]
  );

  const onPointerUp = useCallback(() => {
    if (panning) {
      setPanning(false);
      saveView(view);
    }
    if (dragCard.current) {
      const { id } = dragCard.current;
      const el = document.getElementById(`card-${id}`);
      if (el) {
        const x = parseInt(el.style.left);
        const y = parseInt(el.style.top);
        dragCard.current = null;
        const t = debounceRef.current.get(`pos-${id}`);
        if (t) clearTimeout(t);
        debounceRef.current.set(
          `pos-${id}`,
          setTimeout(() => updateNote(id, { x, y }), 300)
        );
      }
    }
    if (resizeCard.current) {
      const { id } = resizeCard.current;
      const el = document.getElementById(`card-${id}`);
      if (el) {
        const w = parseInt(el.style.width);
        const h = parseInt(el.style.height);
        resizeCard.current = null;
        updateNote(id, { w, h });
      }
    }
  }, [panning, view, saveView, updateNote]);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  // Wheel zoom/pan
  const onWheel = (e: React.WheelEvent) => {
    const isInsideText =
      (e.target as HTMLElement).tagName === 'TEXTAREA' &&
      (e.target as HTMLElement).scrollHeight > (e.target as HTMLElement).clientHeight;
    if (isInsideText) return;
    const next = { x: view.x - e.deltaX, y: view.y - e.deltaY };
    setView(next);
    saveView(next);
  };

  const centerPos = () => {
    const b = boardRef.current;
    if (!b) return { x: 100, y: 100 };
    return {
      x: Math.round(b.clientWidth / 2 - view.x - 130),
      y: Math.round(b.clientHeight / 2 - view.y - 90),
    };
  };

  const handleAddNote = () => {
    const c = centerPos();
    createNote({ type: 'note', x: c.x, y: c.y, w: 260, h: 180 });
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card')) return;
    const b = boardRef.current;
    if (!b) return;
    const rect = b.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left - view.x - 130);
    const y = Math.round(e.clientY - rect.top - view.y - 20);
    createNote({ type: 'note', x, y, w: 260, h: 180 });
  };

  const processFiles = (files: FileList, x: number, y: number) => {
    Array.from(files).forEach((f, i) => {
      const posX = x + i * 26;
      const posY = y + i * 26;
      const reader = new FileReader();
      reader.onload = () => {
        const u = reader.result as string;
        if (f.type.startsWith('image/')) {
          createNote({
            type: 'img',
            x: posX,
            y: posY,
            w: 320,
            file_url: u,
            file_name: f.name,
            file_size: f.size,
          });
        } else {
          createNote({
            type: 'doc',
            x: posX,
            y: posY,
            w: 210,
            file_url: u,
            file_name: f.name,
            file_size: f.size,
          });
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const b = boardRef.current;
    if (!b || !e.dataTransfer.files.length) return;
    const rect = b.getBoundingClientRect();
    processFiles(
      e.dataTransfer.files,
      Math.round(e.clientX - rect.left - view.x - 60),
      Math.round(e.clientY - rect.top - view.y - 40)
    );
  };

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA'].includes(
          (document.activeElement?.tagName || '')
        )
      ) {
        return;
      }
      const c = centerPos();
      if (e.clipboardData?.files.length) {
        processFiles(e.clipboardData.files, c.x, c.y);
      } else {
        const text = e.clipboardData?.getData('text');
        if (text) {
          createNote({ type: 'note', x: c.x, y: c.y, w: 260, h: 180, content: text });
        }
      }
    },
    [view, createNote]
  );

  useEffect(() => {
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onPaste]);

  const recenter = () => {
    const zero = { x: 0, y: 0 };
    setView(zero);
    saveView(zero);
  };

  return (
    <div
      id="board"
      ref={boardRef}
      className={panning ? 'pan' : ''}
      style={{ backgroundPosition: `${view.x}px ${view.y}px` }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      onWheel={onWheel}
    >
      <div
        id="world"
        style={{ transform: `translate(${view.x}px, ${view.y}px)` }}
      >
        {notes.map(it => (
          <div
            key={it.id}
            id={`card-${it.id}`}
            className={`card ${it.type}`}
            style={{
              left: it.x,
              top: it.y,
              width: it.w,
              height: it.h ?? undefined,
              zIndex: it.z_index,
            }}
          >
            <div
              className="hd"
              onPointerDown={e => {
                if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                dragCard.current = {
                  id: it.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  cardX: it.x,
                  cardY: it.y,
                };
              }}
            >
              <span>{it.type === 'img' ? 'image' : it.type === 'doc' ? 'file' : 'note'}</span>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => deleteNote(it.id)}
              >
                ×
              </button>
            </div>

            {it.type === 'note' && (
              <textarea
                spellCheck="false"
                placeholder="Write something…"
                defaultValue={it.content ?? ''}
                onChange={e => {
                  const t = debounceRef.current.get(`note-${it.id}`);
                  if (t) clearTimeout(t);
                  debounceRef.current.set(
                    `note-${it.id}`,
                    setTimeout(() => updateNote(it.id, { content: e.target.value }), 400)
                  );
                }}
              />
            )}

            {it.type === 'img' && it.file_url && (
              <img draggable={false} src={it.file_url} alt="" />
            )}

            {it.type === 'doc' && (
              <div className="doc">
                <em>{((it.file_name || 'file').split('.').pop() || 'file').slice(0, 5)}</em>
                <p>{it.file_name || 'Document'}</p>
                <small>{fsz(it.file_size)}</small>
                {it.file_url && (
                  <a download={it.file_name || 'file'} href={it.file_url}>
                    Download
                  </a>
                )}
              </div>
            )}

            {it.type !== 'doc' && (
              <u
                className="rz"
                onPointerDown={e => {
                  e.stopPropagation();
                  const el = document.getElementById(`card-${it.id}`);
                  if (el) {
                    resizeCard.current = {
                      id: it.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      startW: el.offsetWidth,
                      startH: el.offsetHeight,
                    };
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>

      {notes.length === 0 && !loading && (
        <div id="hint">
          <b>Blank page.</b>Drop images or files, paste, or double-click to write a note.
        </div>
      )}

      <div id="tools">
        <button type="button" onClick={handleAddNote}>
          Note
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Add file
        </button>
        <button type="button" onClick={recenter}>
          Recenter
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        multiple
        hidden
        onChange={e => {
          if (e.target.files) {
            const c = centerPos();
            processFiles(e.target.files, c.x, c.y);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
