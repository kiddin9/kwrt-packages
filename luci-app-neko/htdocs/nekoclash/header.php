<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Home - Neko</title>
    <link rel="icon" href="./assets/img/favicon.png">
    <!-- CSS -->
    <link href="./assets/css/bootstrapicons.css" rel="stylesheet">
    <link href="./assets/css/flatpickr.css" rel="stylesheet">
    <link href="./assets/css/fontawesome.css" rel="stylesheet">
    <link href="./assets/css/piruadmin.css" rel="stylesheet">
    <link href="./assets/css/sweetalert2.css" rel="stylesheet">
    <link href="./assets/css/tagify.css" rel="stylesheet">
    <link href="./assets/css/toastifyjs.css" rel="stylesheet">
    <link href="./assets/css/custom.css" rel="stylesheet">
    
    <script>
      (function () {
        const storedTheme = localStorage.getItem('theme');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = storedTheme || (prefersDarkScheme ? 'dark' : 'light');
        document.documentElement.setAttribute('data-bs-theme', theme);
      })();
    </script>
  </head>