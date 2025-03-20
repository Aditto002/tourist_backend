import express from 'express'
import {     getAllGalleries, 
    addPlace, 
    updatePlace, 
    deletePlace, 
    getPlaceById,
    searchPlaces,
    addReview } from '../controllers/gallery.controller.js';
    import { verifyAdmin } from '../utils/verifyAdmin.js';
    import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get('/galleries', getAllGalleries);
router.get('/place/:id', getPlaceById);
router.get('/search', searchPlaces);
router.post('/:id/review',verifyToken,addReview)
// router.get('/gallerys',Gallerys)

router.post('/add', verifyAdmin, addPlace);
router.put('/update/:id', verifyAdmin, updatePlace);
router.delete('/delete/:id',  verifyAdmin, deletePlace);

export default router;