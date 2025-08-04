/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// constants/Colors.ts
// Définition centralisée des couleurs pour les thèmes light et dark

export interface ColorPalette {
  background: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  accentBorder: string;
  error: string;
  border: string;
  card: string;
}

export const Colors: Record<'light' | 'dark', ColorPalette> = {
  light: {
    // Fond principal de l'application en mode clair
    background: '#fafafa',
    // Couleur de texte principale (labels, titres)
    text: '#333333',
    // Couleur de texte secondaire (valeurs, instructions)
    textSecondary: '#555555',
    // Couleur principale d'interaction (boutons, liens)
    primary: 'purple',
    // Couleur d'accentuation pour actions importantes (bouton de validation)
    accent: '#FFA500',
    // Bordure pour les accents
    accentBorder: '#FF8C00',
    // Couleur d'erreur
    error: '#D32F2F',
    // Couleur des bordures et séparateurs
    border: '#DDDDDD',
    // Couleur de fond des cartes ou conteneurs intermédiaires
    card: '#FFFFFF',
  },
  dark: {
    // Fond spécifique en mode sombre (rgb(89, 33, 71) = 34.9% rouge, 12.94% vert, 27.84% bleu)
    background: 'rgb(89, 33, 71)',
    // Texte principal clair pour contraste
    text: 'rgb(229, 229, 231)',
    // Texte secondaire moins lumineux
    textSecondary: 'rgb(180, 180, 190)',
    // Couleur primaire pour interactions
    primary: 'rgb(10, 132, 255)',
    // Accentuation pour actions importantes
    accent: 'rgb(255, 165, 0)',
    // Bordure d'accentuation
    accentBorder: 'rgb(255, 140, 0)',
    // Couleur d'erreur en sombre
    error: 'rgb(255, 69, 58)',
    // Couleur des bordures et séparateurs en sombre
    border: 'rgb(39, 39, 41)',
    // Fond des cartes en sombre
    card: 'rgb(18, 18, 18)',
  },
};
