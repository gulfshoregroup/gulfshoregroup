import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IScheduleTour extends Document {
  email: string;
  name: string;
  date: Date;
  phone: string;
  message?: string;
  status?: string;
  user?: string;
  property: mongoose.Types.ObjectId;
}

const scheduleTourSchema = new Schema<IScheduleTour>(
  {
    email: String,
    name: String,
    date: Date,
    phone: String,
    message: String,
    status: String,
    user: String,
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  { timestamps: true, strict: false }
);

 const ScheduleTour =
  models.ScheduleTour || model<IScheduleTour>("ScheduleTour", scheduleTourSchema);


export default ScheduleTour;