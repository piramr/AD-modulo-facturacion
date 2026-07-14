const { Router } = require('express');
const express = require('express');
const path = require('path');
const router = Router();

// Configuración estática y fallbacks para la documentación
router.use('/docs', express.static(path.join(__dirname, '../../public/docs'), {
  extensions: ['html', 'htm']
}));

router.get('/docs/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/docs', 'index.html'), (err) => {
    if (err) res.status(404).send("Portal de documentación no encontrado.");
  });
});

router.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/docs', 'index.html'));
});

module.exports = router;
