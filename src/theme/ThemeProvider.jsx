import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { GlobalStyles } from './GlobalStyles';

export const ThemeProvider = ({ children }) => {
  return (
    <StyledThemeProvider theme={{}}>
      <GlobalStyles />
      {children}
    </StyledThemeProvider>
  );
};

export default ThemeProvider;
