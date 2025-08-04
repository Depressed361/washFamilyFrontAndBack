import React, { createContext, useContext, useState } from 'react';

type UserView = 'client' | 'washeur';

const UserViewContext = createContext<{
  view: UserView;
  setView: (v: UserView) => void;
}>({
  view: 'client', // valeur par défaut
  setView: () => {},
});

export const UserViewProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<UserView>('client');

  return (
    <UserViewContext.Provider value={{ view, setView }}>
      {children}
    </UserViewContext.Provider>
  );
};
    
export const useUserView = () => useContext(UserViewContext);
