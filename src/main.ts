import './styles/main.css';
import { initRouter, route } from './router';
import { initNav } from './components/nav';
import { setUser } from './lib/auth-state';
import { getSession } from './lib/auth';
import { renderHome }       from './pages/home';
import { renderDocsIndex }  from './pages/docs-index';
import { renderDocPage }    from './pages/doc-page';
import { renderLogin }      from './pages/login';
import { renderRegister }   from './pages/register';

// Resolve session silently on load — auth token lives in httpOnly cookie
getSession().then(user => { if (user) setUser(user); });

// Register routes
route(/^\/$/, (el) => renderHome(el));
route(/^\/docs$/, (el) => renderDocsIndex(el));
route(/^\/docs\/(.+)$/, (el, m) => renderDocPage(el, m[1]));
route(/^\/login$/, (el) => renderLogin(el));
route(/^\/register$/, (el) => renderRegister(el));

// Mount
const root = document.getElementById('root')!;
initNav();
initRouter(root);
