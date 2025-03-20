import mongoose from "mongoose";


const galleryinfo = new mongoose.Schema({
    picture:{type:String},
    alt:{type:String},
    title:{type:String},
    description:{type:String},
    location: {
        address: String,
        city: String,
        country: String
    },
    price: {
        // regular: {
            type: Number,
            required: true
        // },
        // discount: Number,
        // discountValidUntil: Date
    },
    category: {
        type: String,
        enum: ['beach', 'mountain', 'city', 'rural', 'historic', 'adventure']
    },
    amenities: [{
        type: String
    }],
    maxGuests: {
        type: Number
    },
    availability: {
        type: Boolean,
        default: true
    },
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: Number,
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    featured: {
        type: Boolean,
        default: false
    },
    additionalImages: [{
        url: String,
        caption: String
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }

}, { timestamps: true, versionKey: false });

const Gallery = mongoose.model('Gallery',galleryinfo );

export default Gallery;