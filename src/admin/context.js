import { createContext, useContext } from 'react';

export const AdminCtx = createContext(null);
/** { session, demo, data, setData, update, act, navigate, guard, toast, confirm, resetData } */
export const useAdmin = () => useContext(AdminCtx);
/** Builds an in-app hash link, e.g. href('posts/new') -> '#/posts/new'. */
export const href = (path) => `#/${String(path).replace(/^\/+/, '')}`;
