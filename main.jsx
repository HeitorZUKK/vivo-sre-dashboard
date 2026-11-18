import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'
import VivoDashboard from './Dashboard.jsx'

const theme = extendTheme({
  fonts: {
    // Manual ZUKK: Poppins nos títulos, Helvetica no texto
    heading: `'Poppins', sans-serif`,
    body: `'Helvetica Neue', Helvetica, Arial, sans-serif`,
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  // Cores do manual ZUKK: azul #09A5C1 (brand.500) e azul-marinho #001E3B (navy.900)
  colors: {
    brand: {
      50:  '#E6F8FB',
      100: '#C0EDF4',
      200: '#8FDFEB',
      300: '#5CCFE0',
      400: '#2EBDD3',
      500: '#09A5C1',
      600: '#0889A0',
      700: '#066C7E',
      800: '#04505D',
      900: '#02343C',
    },
    navy: {
      50:  '#EAF0F5',
      100: '#CFDCE7',
      200: '#9CB5CC',
      300: '#6A90B3',
      400: '#3B6D9A',
      500: '#1A5385',
      600: '#0B406F',
      700: '#06325A',
      800: '#022749',
      900: '#001E3B',
    },
    agua: { 400: '#34EACD' },
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
