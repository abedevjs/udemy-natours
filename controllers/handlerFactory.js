const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const APIFeatures = require('./../utils/APIFeatures');

exports.createOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            data: doc
        }
    }); 
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if(popOptions) query.populate(popOptions);
    const doc = await query;
    
    if(!doc) {
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
    
    //Filter ini untuk getAllReviews
    let filter = {}
    if(req.params.tourId) filter = {tour: req.params.tourId};//Untuk melihat seluruh id dari tour tertentu
        //Ini klo ada request pake tour id
        //GET /tour/tour:id/reviews
        //{{URL}}api/v1/tours/5c88fa8cf4afda39709c2955/reviews    
        //Klo filter nya ga ada berarti objek kosong, ga masalah


    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // const doc = await features.query.explain();
    const doc = await features.query;
        
    //WE SEND THE RESPONSE
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc// tours: tours
        }
    });
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {//methode nya mongoose
        //Whenever we use findByIdAndUpdate, all 'save' middleware didnt run

        new: true,
        runValidators: true
    });

    if(!doc) {//if there is no tour
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
        status: "success",
        data: {
          data: doc //atau tour: tour < krn es6 jd lebih simpel
        }
    });
});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    
    if(!doc) {
        return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null//when delete operation we dont send any feed back to the client
    });  
});