// theme.js

// 1. import `extendTheme` function
import { extendTheme } from '@chakra-ui/react'
import { mode } from '@chakra-ui/theme-tools';

const styles = {
    global: {
        'html': {
            'fontSize': '62.5%',
            'WebkitTextSizeAdjust': '100%',
            'MozTextSizeAdjust': '100%',
            'textSizeAdjust': '100%'
        },
        'html, body': {
            //color: mode('gray.800', 'whiteAlpha.900')(props),
            bg: 'blacks.400',
        },
        'body': { 'fontSize': '160%' }
    }
};

// 2. Add your color mode config
const config = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
}

const fonts = {
    body: "proxima-nova, sans-serif;",
    heading: "proxima-nova, sans-serif;"
    // heading: '"Inter", "Oswald", sans-serif;',
    //body: '"Inter", "Oswald", sans-serif;'
}

const colors = {
    blacks: {
        100: "#181818",
        150: "rgb(15,15,15)",
        200: "rgb(20,20,20)",
        300: "rgb(30,30,30)",
        400: "rgb(40,40,40)",
        500: "rgb(50,50,50)",
        600: "rgb(60,60,60)",
        700: "rgb(70,70,70)",
        800: "rgb(80,80,80)",
        900: "rgb(90,90,90)",
    },
    brand: {
        100: "#d1ffd2",
        300: "#94ff97",
        500: "#63ed56",
        600: "#52c548",
        700: "#63ed56",
        900: "#63ed56"
    },
    gray: {
        50: 'rgb(245, 245, 245)',
        100: 'rgb(220, 220, 220)',
        200: 'rgb(190, 190, 190)',
        300: 'rgb(160, 160, 160)',
        400: 'rgb(135, 135, 135)',
        500: 'rgb(100, 100, 100)',
        600: 'rgb(50, 50, 50)',
        700: 'rgb(30, 30, 30)',
        800: 'rgb(20, 20, 20)',
        900: 'rgb(10, 10, 10)'
    },
    acos: {
        100: '#111',
        200: '#222',
        300: '#333'
    }
}

const fontSizes = {
    '3xs': "0.8rem",
    '2xs': "1rem",
    xxs: "1.2rem",
    xs: "1.4rem",
    sm: "1.6rem",
    md: "1.8rem",
    lg: "2rem",
    xl: "2.2rem",
    '2xl': "2.4rem",
    '3xl': "2.8rem",
    '4xl': "3.2rem"
}

const components = {
    Button: {
        baseStyle: {
            bgColor: 'transparent',
            outline: 'none',
            bgGradient: 'none',
            _active: { outline: 'none', boxShadow: 'none', bgGradient: 'none' },
            _hover: { outline: 'none', boxShadow: 'none', bgGradient: 'none' },
            _focus: { outline: 'none', boxShadow: 'none', bgGradient: 'none' }
        },
        variants: {
            base: {
                bgColor: 'transparent',
                outline: 'none',
                _active: { outline: 'none' },
                _hover: { outline: 'none' },
                _focus: { outline: 'none' }
            }
        },
        defaultProps: {
            variant: 'base'
        }
    },
    Tabs: {
        variants: {
            base: {
                paddingY: '4',
                marging: '0',
                tab: {
                    _selected: {
                        color: 'white',
                        boxShadow: 'none',
                        borderBottom: '2px solid',
                        borderBottomColor: 'gray.400',
                        fontWeight: 'bold'
                    },
                    color: 'gray.400'
                },
            },
        },
    },
}

// 3. extend the theme
const theme = extendTheme({ config, fonts, colors, styles, fontSizes, components })

export default theme