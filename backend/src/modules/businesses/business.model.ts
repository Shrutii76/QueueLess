import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBusiness extends Document {
  owner: Types.ObjectId;
  name: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;

  address: {
    street?: string;
    city: string;
    state: string;
    pincode?: string;
    country: string;
  };

  location?: {
    type: "Point";
    coordinates: [number, number];
  };

  services: {
    name: string;
    description?: string;
    duration: number;
    isActive: boolean;
  }[];

  operatingHours: {
    day: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }[];

  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";

  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: 1000,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    address: {
      street: String,
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: String,
      country: {
        type: String,
        default: "India",
      },
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
        validate: {
          validator: (coordinates: number[]) =>
            coordinates.length === 2 &&
            coordinates[0] >= -180 &&
            coordinates[0] <= 180 &&
            coordinates[1] >= -90 &&
            coordinates[1] <= 90,
          message: "Invalid GeoJSON coordinates",
        },
      },
    },

    services: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: String,
        duration: {
          type: Number,
          required: true,
          min: 1,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    operatingHours: [
      {
        day: {
          type: String,
          enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
          ],
          required: true,
        },

        isOpen: {
          type: Boolean,
          default: true,
        },

        openTime: String,
        closeTime: String,
      },
    ],

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Geospatial index for nearby business discovery
businessSchema.index({ location: "2dsphere" });

businessSchema.index({ category: 1, status: 1 });

const Business = mongoose.model<IBusiness>("Business", businessSchema);

export default Business;
