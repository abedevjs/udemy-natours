module.exports = fn => {//function ini buat menyatukan block catch error dalam asynchronous function
    //ini utk wrapper function yg didalamnya ada middleware function jd bukan asal catchAsync di setiap ada async function
    
    return (req, res, next) => {
        fn(req, res, next).catch(next)
    }
};