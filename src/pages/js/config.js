// themeConfig.js
export const themeColors = {
    themeprimary: localStorage.getItem("themeprimary") || '#1AB0B0',
    themesecondary: localStorage.getItem("themesecondary") || '#ff7042',
    themesuccess: localStorage.getItem("themesuccess") || '#02BC7D',
    themeinfo: localStorage.getItem("themeinfo") || '#2196F3',
    themewarning: localStorage.getItem("themewarning") || '#F5BA4A',
    themedanger: localStorage.getItem("themedanger") || '#F75C7F',
};