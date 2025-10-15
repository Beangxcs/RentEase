
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error happened:', err);


  if (err.name === 'CastError') {
    const message = 'Invalid ID format. Please check the ID and try again.';
    error = { message, statusCode: 400 };
  }

  if (err.code === 11000) {
    const message = 'This information already exists. Please try with different details.';
    error = { message, statusCode: 400 };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Something went wrong on our end. Please try again.',
    ...(process.env.NODE_ENV === 'development' && { 
      technicalDetails: err.stack 
    })
  });
};


const notFound = (req, res, next) => {
  const error = new Error(`Sorry, the page '${req.originalUrl}' doesn't exist. Please check the URL and try again.`);
  error.statusCode = 404;
  next(error); 
};


module.exports = { errorHandler, notFound };