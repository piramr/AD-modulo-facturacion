const { Router } = require('express');
const router = Router();
const reporteFacturaService = require('../services/reporteFactura.service');
const reporteClienteService = require('../services/reporteCliente.service');
const { verificarTokenConSeguridad, verificarRol } = require('../middlewares/auth.middleware');

router.use(verificarTokenConSeguridad);
router.use(verificarRol(['FAC_ADMINISTRADOR', 'FAC_CAJERO']));

// 1. GET /api/reportes/facturas/:id/pdf
router.get('/facturas/:id/pdf', async (req, res) => {
  try {
    const reporte = await reporteFacturaService.generarPdfFactura(req.params.id, req.usuario);

    if (reporte.durationMs > 30000) {
      return res.status(504).json({
        error: 'La generacion del PDF supero los 30 segundos',
        durationMs: reporte.durationMs
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${reporte.filename}"`);
    res.setHeader('Content-Length', reporte.buffer.length);
    res.setHeader('X-Generation-Time-Ms', String(reporte.durationMs));
    res.setHeader('X-Report-Message', reporte.message);
    return res.status(200).send(reporte.buffer);
  } catch (err) {
    return res.status(err.codigo || 500).json({ error: err.message });
  }
});

// 2. GET /api/reportes/facturas
router.get('/facturas', async (req, res) => {
  try {
    if (req.query.format === 'pdf') {
      const reporte = await reporteFacturaService.generarPdfReporteFacturas(req.query);

      if (reporte.durationMs > 30000) {
        return res.status(504).json({
          error: 'La generacion del reporte supero los 30 segundos',
          durationMs: reporte.durationMs
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${reporte.filename}"`);
      res.setHeader('Content-Length', reporte.buffer.length);
      res.setHeader('X-Generation-Time-Ms', String(reporte.durationMs));
      res.setHeader('X-Report-Message', reporte.message);
      return res.status(200).send(reporte.buffer);
    }

    const reporte = await reporteFacturaService.obtenerDatosReporteFacturas(req.query);

    if (reporte.durationMs > 30000) {
      return res.status(504).json({
        error: 'La generacion del reporte supero los 30 segundos',
        durationMs: reporte.durationMs
      });
    }

    return res.status(200).json({
      ...reporte,
      message: 'Reporte de facturas generado con exito'
    });
  } catch (err) {
    return res.status(err.codigo || 500).json({ error: err.message });
  }
});

// 3. GET /api/reportes/clientes
router.get('/clientes', async (req, res) => {
  try {
    if (req.query.format === 'pdf') {
      const reporte = await reporteClienteService.generarPdfClientes(req.query);

      if (reporte.durationMs > 30000) {
        return res.status(504).json({
          error: 'La generacion del reporte supero los 30 segundos',
          durationMs: reporte.durationMs
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${reporte.filename}"`);
      res.setHeader('Content-Length', reporte.buffer.length);
      res.setHeader('X-Generation-Time-Ms', String(reporte.durationMs));
      res.setHeader('X-Report-Message', 'Reporte de clientes generado con exito');
      return res.status(200).send(reporte.buffer);
    }

    const reporte = await reporteClienteService.obtenerDatosReporteClientes(req.query);

    if (reporte.durationMs > 30000) {
      return res.status(504).json({
        error: 'La generacion del reporte supero los 30 segundos',
        durationMs: reporte.durationMs
      });
    }

    return res.status(200).json({
      ...reporte,
      message: 'Reporte de clientes generado con exito'
    });
  } catch (err) {
    return res.status(err.codigo || 500).json({ error: err.message });
  }
});

module.exports = router;
