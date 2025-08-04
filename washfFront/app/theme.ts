
export const getThemeStyles = (view: 'client' | 'washeur') => {
  return {
    colors: {
      primary: view === 'washeur' ? 'green' : 'purple', 
      background: view === 'washeur' ? '#f0fff4' : '#f8f0ff',
      buttonText: '#fff',
      text: view === 'washeur' ? '#206a37' : '#5c2d91',
    },
    button: {
      borderRadius: 8,
      paddingVertical: 14,
      paddingHorizontal: 24,
      backgroundColor: '#6A0DAD',
    },
    badge: {
      backgroundColor: view === 'washeur' ? '#c8facc' : '#e0ccff',
      borderRadius: 50,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '700' as const,       
      fontSize: 16,
      textAlign: 'center' as const,
    }
  };
};