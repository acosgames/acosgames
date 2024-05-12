// theme.js

// 1. import `extendTheme` function
import { extendTheme, textDecoration } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const styles = {
    global: {
        html: {
            fontSize: "62.5%",
            WebkitTextSizeAdjust: "100%",
            MozTextSizeAdjust: "100%",
            textSizeAdjust: "100%",
            fontFeatureSettings: '"kern","lig"',
        },
        "html, body": {
            //color: mode('gray.800', 'whiteAlpha.900')(props),
            bg: "gray.850",
            color: "gray.10",
            fontWeight: 500,
        },
        body: { fontSize: "1.4rem", color: "gray.20" },

        "::selection": {
            background: "gray.400" /* WebKit/Blink Browsers */,
        },
        "::-moz-selection": {
            background: "gray.400" /* Gecko Browsers */,
        },
    },
};

// 2. Add your color mode config
const config = {
    initialColorMode: "dark",
    useSystemColorMode: false,
};

const fonts = {
    // body: "proxima-nova, sans-serif;",
    // heading: "proxima-nova, sans-serif;"
    body: `'Poppins', sans-serif`,
    heading: `'Barlow', sans-serif`,
    // heading: '"Inter", "Oswald", sans-serif;',
    //body: '"Inter", "Oswald", sans-serif;'
};

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
        50: "#8affb9",
        75: "#71ffa3",
        100: "#68fb9a",
        200: "#51ff8a",
        300: "#45f882",
        400: "#22e46f",
        500: "#00c755",
        600: "#ffbe18",
        700: "#ffc827",
        900: "#ffd639",
        1000: "#ffe449",
    },
    blues: {
        50: "#e9ebfd",
        75: "#a6abf8",
        100: "#8188f5",
        200: "#4b55f0",
        300: "#2632ed",
        400: "#1b23a6",
        500: "#171f91",
    },
    //experimental blue 0F161B
    gray: {
        0: "#f7ffff",
        10: "#ecf5fd",
        20: "#e0e9f2",
        30: "#d5dee6",
        40: "#cad3db",
        50: "#bfc8d0",
        60: "#b9c2ca",
        70: "#b4bdc4",
        80: "#afb7bf",
        90: "#a9b2b9",
        100: "#adb0bc",
        125: "#a4acb4",
        150: "#8a9299",
        175: "#70787f",
        200: "#5f676e",
        300: "#555d64",
        400: "#4c545a",
        500: "#434a51",
        600: "#394147",
        700: "#31383e",
        750: "#282f35",
        800: "#201f2a",
        825: "#1b242e",
        850: "#181e24",
        875: "#182029",
        900: "#0f161b",
        925: "#0b0e13",
        950: "#090D10",
        975: "#050506",
        1000: "#040608",
        1050: "#000c17",
        1100: "#000912",
        1200: "#00060f",
    },
    pl: {
        50: "#e6eeeb",
        75: "#99b8af",
        100: "#6e9a8d",
        200: "#306f5c",
        300: "#05513b",
        400: "#043929",
        500: "#033124",
    },
    sl: {
        50: "#e7e8f8",
        75: "#9da1e4",
        100: "#747ad9",
        200: "#3841c8",
        300: "#0f1abd",
        400: "#0b1284",
        500: "#091073",
    },

    acos: {
        100: "#111",
        200: "#222",
        300: "#333",
    },
};

const fontSizes = {
    "3xs": "0.8rem",
    "2xs": "1rem",
    xxs: "1.2rem",
    xs: "1.4rem",
    sm: "1.6rem",
    md: "1.8rem",
    lg: "2rem",
    xl: "2.2rem",
    "2xl": "2.4rem",
    "3xl": "2.8rem",
    "4xl": "3.2rem",
};

const components = {
    Breadcrumb: {
        baseStyle: {
            item: {
                color: "gray.100",
            },
            link: {
                color: "gray.20",
                fontSize: "1.2rem",
            },
            currentpage: {
                color: "gray.50",
            },
        },
    },
    Card: {
        baseStyle: {
            container: {
                w: "100%",
                // border: "1px solid",
                // borderColor: "var(--chakra-colors-gray-800)",
                bgColor: "transparent",
                position: "relative",
                overflow: "visible",
                zIndex: 2,
                _before: {
                    content: "''",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    clipPath:
                        "polygon(100% 0, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%, 0 0)",
                    bgColor: "gray.700",
                    borderRadius: "8px",
                    zIndex: -1,
                },
            },
        },
    },
    Tooltip: {
        baseStyle: {
            bgColor: "gray.1200",
            color: "gray.0",
            fontSize: "1.2rem",
            // top: "1rem",
            p: "1rem",
        },
        // defaultProps: {
        //     variant: "base",
        // },
    },
    Heading: {
        baseStyle: {
            color: "gray.10",
            fontWeight: "600",
        },
        variants: {
            h1: {
                as: "h1",
                w: "100%",
                color: "gray.10",
                fontSize: "3rem",
                mb: "2rem",
            },
        },
    },
    Button: {
        baseStyle: {
            bgColor: "transparent",
            outline: "none",
            bgGradient: "none",
            _active: { outline: "none", boxShadow: "none", bgGradient: "none" },
            _hover: { outline: "none", boxShadow: "none", bgGradient: "none" },
            _focus: { outline: "none", boxShadow: "none", bgGradient: "none" },
        },
        variants: {
            base: {
                bgColor: "transparent",
                outline: "none",
                _active: { outline: "none" },
                _hover: { outline: "none" },
                _focus: { outline: "none" },
            },
            primary: {
                bgColor: "brand.500",
                color: "gray.0",
                borderRadius: "2rem",
                fontWeight: "500",
                p: "2rem",
                fontSize: "1.4rem",
                outline: "none",
                _active: { outline: "none" },
                _hover: { outline: "none", bgColor: "brand.400" },
                _focus: { outline: "none" },
            },
        },
        // defaultProps: {
        //     variant: "base",
        // },
    },
    Modal: {
        baseStyle: {
            header: { fontSize: "2rem" },
            dialogContainer: {},
            dialog: { bgColor: "gray.800", borderRadius: "2rem" },
            closeButton: { bgColor: "red.500" },
            body: {},
            footer: {},
        },
        variants: {
            sidepanel: {
                header: {},
                dialogContainer: {
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                },
                dialog: { bgColor: "gray.800" },
                closeButton: { bgColor: "red.500" },
                body: {},
                footer: {},
            },
        },
    },
    Tabs: {
        baseStyle: {
            tab: {
                transition: "all 0.3s ease",
                outline: "none",
                _selected: {
                    outline: "none",
                    border: "0",
                },
            },
        },
        variants: {
            dev: {
                root: {
                    w: "100%",
                },

                tablist: {
                    width: "100%",
                },
                tab: {
                    color: "gray.40",
                    px: "3rem",
                    py: "2rem",
                    height: "6.4rem",
                    transition: "all 0.3s ease",
                    fontWeight: "500",
                    fontSize: ["1.4rem", "1.4rem", "1.4rem", "1.6rem"],
                    fontFamily: "'Poppins', sans-serif",
                    borderTopRadius: "lg",
                    position: "relative",
                    borderBottom: "2px solid",
                    borderBottomColor: "gray.1200",
                    whiteSpace: "nowrap",
                    _hover: {
                        color: "gray.10",
                        borderBottom: "2px solid",
                        borderBottomColor: "brand.300",
                    },
                    _selected: {
                        color: "brand.300 !important",
                        borderColor: "brand.300",
                        borderBottom: "2px solid",
                        zIndex: "2",
                    },
                },
                tabpanels: {
                    width: "100%",
                },
                tabpanel: {
                    mt: "2rem",
                    mb: "8rem",
                    px: "1rem",
                },
            },
            subtabs: {
                tabpanel: {
                    padding: "0",
                },
                tab: {
                    color: "gray.200",
                    cursor: "pointer",
                    _selected: {
                        cursor: "auto",
                        color: "brand.300",
                    },
                    _focus: { outline: "none" },
                    as: "span",
                    letterSpacing: "0px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    padding: ["1rem", "1rem", "0.5rem", "1rem"],
                    fontSize: ["1.2rem", "1.2rem", "1.3rem", "1.4rem"],
                },
            },
            brand: {
                tabs: {
                    // width: '100%',
                    // overflow: 'auto',
                    // mx: '2rem',
                },
                tab: {
                    color: "gray.40",
                    // py: '1rem',
                    // border: '2px solid',
                    // borderColor: 'transparent',
                    // use colorScheme to change background color with dark and light mode options
                    // bg: ,

                    px: "1.5rem",

                    py: "2rem",
                    height: "6.4rem",
                    transition: "all 0.3s ease",
                    fontWeight: "500",
                    fontSize: ["1.4rem", "1.4rem", "1.4rem", "1.6rem"],
                    fontFamily: "'Poppins', sans-serif",
                    borderTopRadius: "lg",
                    position: "relative",
                    borderBottom: "2px solid",
                    borderBottomColor: "gray.1200",
                    whiteSpace: "nowrap",
                    // mb: '-2px',
                    _hover: {
                        color: "gray.10",
                        borderBottom: "2px solid",
                        borderBottomColor: "brand.300",
                    },
                    _selected: {
                        // bg: mode('#fff', 'gray.800')(props),
                        color: "brand.300 !important",
                        borderColor: "brand.300",
                        borderBottom: "2px solid",
                        zIndex: "2",
                        // mb: '-2px',
                        // _after: {
                        //     content: "''",
                        //     position: 'absolute',
                        //     bottom: 0,
                        //     left: 0,
                        //     width: '100%',
                        //     height: '2px',
                        //     background: 'brand.300',
                        //     zIndex: '2',
                        // }
                    },
                },
                tablist: {
                    // width: 'max-content',
                    // overflow: 'scroll',
                    // justifyContent: 'center',
                    // alignItems: 'center',
                    // overflow: 'hidden',
                    // marginBottom: '-1.6rem',
                    paddingBottom: 0,
                    marginBottom: 0,
                    bgColor: "gray.1200",
                    // borderBottom: '2px solid',
                    // borderColor: 'gray.850',
                    // position: 'relative',
                    // pt: "4rem",
                    height: "6.4rem",
                    padding: 0,

                    // _after: {
                    //     content: "''",
                    //     position: 'absolute',
                    //     bottom: 0,
                    //     left: '3rem',
                    //     width: '100%',
                    //     height: '2px',
                    //     background: 'linear-gradient(to right, var(--chakra-colors-gray-700), rgba(0,0,0,0))',
                    // }
                },
                tabpanels: {
                    padding: "0",
                },
                tabpanel: {
                    padding: "0",
                    paddingTop: "0rem",
                    transition: "all 0.3s ease",
                    minH: "20rem",
                    bgColor: "gray.925",
                    // border: '2px solid',
                    // borderColor: 'inherit',
                    // borderBottomRadius: 'lg',
                    // borderTopRightRadius: 'lg',
                },
            },
        },
    },
    Progress: {
        baseStyle: {
            filledTrack: {
                bg: "brand.300",
            },
        },
        variants: {
            green: {
                filledTrack: {
                    bg: "brand.500",
                },
            },
            yellow: {
                filledTrack: {
                    bg: "brand.600",
                },
            },
        },
    },
    Switch: {
        baseStyle: {
            container: {
                // width: "50px",
            },
            thumb: {
                // width: "20px", height: "20px",
                // _checked: { right: 0 },
            },
            track: {
                //  width: "50px", height: "20px"
                _checked: {
                    bgColor: "brand.500",
                },
            },
        },
    },
};

const breakpoints = {
    sm: "500px", // 480px
    md: "800px", // 768px
    lg: "992px", // 992px
    xl: "1280px", // 1280px
    "2xl": "1536px", // 1536px
};

// 3. extend the theme
const theme = extendTheme({
    config,
    fonts,
    colors,
    styles,
    fontSizes,
    components,
    breakpoints,
});

export default theme;
