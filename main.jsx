import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'
import VivoDashboard from './Dashboard.jsx'

const theme = extendTheme({
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  // Cores da marca Zukk: turquesa (logo) e azul-marinho (fundo da marca)
  colors: {
    brand: {
      50:  '#E9F8FA',
      100: '#CBEFF4',
      200: '#A3E2EB',
      300: '#7AD5E1',
      400: '#58C8D8',
      500: '#2C98A5',
      600: '#23808C',
      700: '#1B6670',
      800: '#134C54',
      900: '#0B3338',
    },
    navy: {
      50:  '#E7EAF0',
      100: '#C3CAD8',
      200: '#8E9AB3',
      300: '#5A6A8E',
      400: '#34466F',
      500: '#1A2D55',
      600: '#0F2245',
      700: '#0A1B3A',
      800: '#071733',
      900: '#04142E',
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <VivoDashboard />
    </ChakraProvider>
  </React.StrictMode>
)
