// ./typings/react-native-google-places-autocomplete.d.ts
declare module 'react-native-google-places-autocomplete' {
  import type { ComponentType } from 'react';
    import type { TextInputProps, TextStyle, ViewStyle } from 'react-native';

  export interface GooglePlacesAutocompleteProps {
    placeholder?: string;
    minLength?: number;
    fetchDetails?: boolean;
    onPress: (data: any, details: any) => void;
    query: { key: string; language: string; types?: string };
    debounce?: number;
    styles?: {
      textInputContainer?: ViewStyle;
      textInput?: TextStyle;
      listView?: ViewStyle;
    };
    onFail?: (error: any) => void;
    textInputProps?: TextInputProps;
    [extra: string]: any;
  }

  const GooglePlacesAutocomplete: ComponentType<GooglePlacesAutocompleteProps>;
  export default GooglePlacesAutocomplete;
}
