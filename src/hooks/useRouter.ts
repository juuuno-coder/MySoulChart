// 간단한 Hash 라우터 훅 (Phase 2 통합)
import { useState, useEffect } from 'react';

export type Route =
  | { path: 'home' }
  | { path: 'chat'; mode: string }
  | { path: 'view'; permissionId: string };

export function useRouter() {
  const [currentRoute, setCurrentRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(parseHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: Route) => {
    let hash = '#/';

    if (route.path === 'chat') {
      hash = `#/chat/${route.mode}`;
    } else if (route.path === 'view') {
      hash = `#/view/${route.permissionId}`;
    }

    window.location.hash = hash;
  };

  return { currentRoute, navigate };
}

function parseHash(): Route {
  const hash = window.location.hash.slice(1); // '#' 제거

  if (!hash || hash === '/') {
    return { path: 'home' };
  }

  const parts = hash.split('/').filter(Boolean);

  if (parts[0] === 'chat' && parts[1]) {
    return { path: 'chat', mode: parts[1] };
  }

  if (parts[0] === 'view' && parts[1]) {
    return { path: 'view', permissionId: parts[1] };
  }

  return { path: 'home' };
}
