// themeConfig.js
export const themeColors = {
    themeprimary: localStorage.getItem("themeprimary") || '#0066FF',
    themesecondary: localStorage.getItem("themesecondary") || '#00D2F4',
    themesuccess: localStorage.getItem("themesuccess") || '#02BC7D',
    themeinfo: localStorage.getItem("themeinfo") || '#0088FF',
    themewarning: localStorage.getItem("themewarning") || '#F5BA4A',
    themedanger: localStorage.getItem("themedanger") || '#F75C7F',
};