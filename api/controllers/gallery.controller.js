// import Gallery from "../models/gallery.model.js";


// export const Gallerys = async (req, res) => {
//     try {
//         const gallery = await Gallery.find();
//         res.status(200).json(gallery);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };

import Gallery from "../models/gallery.model.js";
import { errorHandler } from '../utils/error.js';

// Get all places/galleries
export const getAllGalleries = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, location } = req.query;
        let query = {};

        if (category) query.category = category;
        if (location) query['location.city'] = { $regex: location, $options: 'i' };
        if (minPrice) query['price.regular'] = { $gte: parseFloat(minPrice) };
        if (maxPrice) query['price.regular'] = { ...query['price.regular'], $lte: parseFloat(maxPrice) };

        const places = await Gallery.find(query);
        res.status(200).json({
            status: "success",
            results: places.length,
            data: places
        });
    } catch (error) {
        console.log(error);
    }
};

// Add new place to gallery (Admin only)
export const addPlace = async (req, res) => {
    try {
        const {
            picture,
            alt,
            title,
            description,
            location,
            price,
            category,
            amenities,
            maxGuests,
            additionalImages
        } = req.body;

        // if (!picture || !title || !description) {
        //     return console.log(errorHandler(400, 'Please provide all required fields'));
        // }

        const newPlace = await Gallery.create({
            picture,
            alt: alt || title,
            title,
            description,
            location,
            price,
            category,
            amenities,
            maxGuests,
            additionalImages,
            createdBy: req.user.id // From admin authentication
        });
        res.status(201).json({
            status: "success",
            message: "Place added successfully",
            data: newPlace
        });
    } catch (error) {
        console.log(error);
    }
};

// Update place in gallery (Admin only)
export const updatePlace = async (req, res) => {
    try {
        const placeId = req.params.id;
        const updates = req.body;
        updates.updatedBy = req.user.id; 
        const updatedPlace = await Gallery.findByIdAndUpdate(
            placeId,
            updates,
            { new: true }
        );

        if (!updatedPlace) {
            return console.log(errorHandler(404, 'Place not found'));
        }

        res.status(200).json({
            status: "success",
            message: "Place updated successfully",
            data: updatedPlace
        });
    } catch (error) {
        console.log(error);
    }
};


export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const placeId = req.params.id;

        const place = await Gallery.findById(placeId);
        if (!place) {
            return console.log(errorHandler(404, 'Place not found'));
        }

        // Add new review
        place.reviews.push({
            user: req.user.id,
            rating,
            comment
        });

        // Update average rating
        const totalRating = place.reviews.reduce((sum, review) => sum + review.rating, 0);
        place.rating.average = totalRating / place.reviews.length;
        place.rating.count = place.reviews.length;

        await place.save();

        res.status(200).json({
            status: "success",
            message: "Review added successfully",
            data: place
        });
    } catch (error) {
        console.log(error);
    }
};

// Toggle featured status
export const toggleFeatured = async (req, res) => {
    try {
        const place = await Gallery.findById(req.params.id);
        if (!place) {
            return console.log(errorHandler(404, 'Place not found'));
        }

        place.featured = !place.featured;
        await place.save();

        res.status(200).json({
            status: "success",
            message: `Place ${place.featured ? 'featured' : 'unfeatured'} successfully`,
            data: place
        });
    } catch (error) {
        console.log(error);
    }
};


// Get featured places
export const getFeaturedPlaces = async (req, res) => {
    try {
        const featuredPlaces = await Gallery.find({ featured: true });
        res.status(200).json({
            status: "success",
            results: featuredPlaces.length,
            data: featuredPlaces
        });
    } catch (error) {
        console.log(error);
    }
};
// Delete place from gallery (Admin only)
export const deletePlace = async (req, res) => {
    try {
        const placeId = req.params.id;
        const deletedPlace = await Gallery.findByIdAndDelete(placeId);

        if (!deletedPlace) {
            return console.log(errorHandler(404, 'Place not found'));
        }

        res.status(200).json({
            status: "success",
            message: "Place deleted successfully"
        });
    } catch (error) {
        console.log(error);
    }
};
////////////////////////////////////////////////////////////////////////////////////////
// Get single place details
export const getPlaceById = async (req, res) => {
    try {
        const placeId = req.params.id;
        const place = await Gallery.findById(placeId);

        if (!place) {
            return console.log(errorHandler(404, 'Place not found'));
        }

        res.status(200).json({
            status: "success",
            data: place
        });
    } catch (error) {
        console.log(error);
    }
};

// Search places by title
export const searchPlaces = async (req, res) => {
    try {
        const { query } = req.query;
        const places = await Gallery.find({
            title: { $regex: query, $options: 'i' }
        });

        res.status(200).json({
            status: "success",
            data: places
        });
    } catch (error) {
        console.log(error);
    }
};