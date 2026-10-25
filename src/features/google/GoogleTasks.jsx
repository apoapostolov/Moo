import { useCallback, useEffect, useState } from 'react';

import { useGoogleAuth } from './hooks/useGoogleAuth';
import { listTaskLists, listTasks, setTaskCompleted } from './services/tasks';
import ConnectPrompt, { describeError } from './components/ConnectPrompt';
import TaskDialog from './components/TaskDialog';

import './google.scss';

const REFRESH_MS = 5 * 60 * 1000;

const dueLabel = (due) => {
  if (!due) return '';

  const date = new Date(due);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) return 'Today';

  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const GoogleTasks = () => {
  const { auth, loading, error, connectAccount } = useGoogleAuth();
  const [lists, setLists] = useState([]);
  const [listId, setListId] = useState(() => localStorage.getItem('googleTasksList') || '');
  const [tasks, setTasks] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [editing, setEditing] = useState(null);

  const loadLists = useCallback(async () => {
    try {
      const loaded = await listTaskLists();
      setLists(loaded);

      const stored = localStorage.getItem('googleTasksList');
      const valid = loaded.some((list) => list.id === stored);

      if (!valid && loaded.length) {
        localStorage.setItem('googleTasksList', loaded[0].id);
        setListId(loaded[0].id);
      }

      return valid ? stored : loaded[0]?.id ?? '';
    } catch (loadError) {
      setFetchError(loadError.message);

      return '';
    }
  }, []);

  const loadTasks = useCallback(async (id) => {
    if (!id) return;

    try {
      setTasks(await listTasks(id));
    } catch (loadError) {
      setFetchError(loadError.message);
    }
  }, []);

  useEffect(() => {
    if (!auth) return undefined;

    let timer;

    loadLists().then((id) => {
      loadTasks(id);
      timer = setInterval(() => loadTasks(id), REFRESH_MS);
    });

    return () => clearInterval(timer);
  }, [auth, loadLists, loadTasks]);

  const changeList = (id) => {
    localStorage.setItem('googleTasksList', id);
    setListId(id);
    setTasks([]);
    loadTasks(id);
  };

  const toggle = async (task) => {
    const completed = task.status !== 'completed';

    // Optimistic: the checkbox has to react under the finger.
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: completed ? 'completed' : 'needsAction' } : item,
      ),
    );

    try {
      await setTaskCompleted(listId, task.id, completed);
    } catch (toggleError) {
      setFetchError(toggleError.message);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: task.status } : item,
        ),
      );
    }
  };

  const onSaved = useCallback((saved) => {
    setTasks((current) => {
      const exists = current.some((task) => task.id === saved.id);

      return exists ? current.map((task) => (task.id === saved.id ? saved : task)) : [saved, ...current];
    });
  }, []);

  const onDeleted = useCallback((id) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  if (loading) return null;

  if (!auth) {
    return <ConnectPrompt label="Tasks" onConnect={connectAccount} error={error} />;
  }

  const active = tasks.filter((task) => task.status !== 'completed');

  return (
    <div className="googleWidget">
      <header className="gwHead">
        <span className="gwLabel">
          {lists.length > 1 ? (
            <select
              className="gwSelect"
              value={listId}
              onChange={(changeEvent) => changeList(changeEvent.target.value)}
              aria-label="Task list"
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          ) : (
            lists[0]?.title || 'Tasks'
          )}
        </span>
        <button
          type="button"
          className="gwIconButton"
          onClick={() => setEditing({})}
          aria-label="New task"
          title="New task"
        >
          +
        </button>
      </header>

      {fetchError && <p className="gwError">{describeError(fetchError)}</p>}

      {!fetchError && !active.length && <p className="gwEmpty">Nothing left to do.</p>}

      <ul className="gwList">
        {active.map((task) => (
          <li key={task.id} className="gwTaskRow">
            <input
              type="checkbox"
              className="gwCheck"
              checked={task.status === 'completed'}
              onChange={() => toggle(task)}
              aria-label={`Complete ${task.title}`}
            />
            <button type="button" className="gwItem bare" onClick={() => setEditing(task)}>
              <span className="gwItemTop">
                <span className="gwItemTitle">{task.title}</span>
                {task.due && <span className="gwItemMeta">{dueLabel(task.due)}</span>}
              </span>
              {task.notes && <span className="gwItemSub">{task.notes}</span>}
            </button>
          </li>
        ))}
      </ul>

      {editing && (
        <TaskDialog
          task={editing.id ? editing : null}
          listId={listId}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
};

export default GoogleTasks;
