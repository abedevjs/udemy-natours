//di file js yg ini tempat dimana API constructor di buat agar bisa dipake berulang2 oleh route yg lain
class APIFeatures {
    constructor(query, queryString) {//query = dari mongoose query. Dan queryString = we got from express
        this.query = query;//query ini dari mongoose aslinya req.query
        this.queryString = queryString;//query ini dari express
    } 

    filter() {
        //WE BUILD THE QUERY
            //1. Filtering
            const queryObj = { ...this.queryString };
            //1. ini namanya destructuring
            //2. {} ini create new object

        const excludeFields = ['page', 'sort', 'limit', 'fields'];
        excludeFields.forEach(el => delete queryObj[el]);

            //2. Advanced Filtering
        let queryStr = JSON.stringify(queryObj);//JSON.stringify convert object json ke string
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
            //ok penjelasan ini ada di folder 8 video 15
            //127.0.0.1:3000/api/v1/tours?duration[gte]=5
            //127.0.0.1:3000/api/v1/tours?price[lt]=1500&duration[gte]=5

        //let query = Tour.find(JSON.parse(queryStr));//JSON.parse convert string ke JSON object
        this.query =  this.query.find(JSON.parse(queryStr));

        return this;//this ini berlaku untuk semua object diatas yaitu this.query dan this.queryString
        
    }

    sort() {
        //3. Sorting
        if(this.queryString.sort) {//127.0.0.1:3000/api/v1/tours?sort=price, 127.0.0.1:3000/api/v1/tours?sort=price.ratingsAverage
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        //4. fields
        if(this.queryString.fields) {//127.0.0.1:3000/api/v1/tours?fields=name, duration,price
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');//tanda minus artinya we dont show it to the client
        }

        return this;
    }

    paginate() {
        //5. Pagination. 1-10 page 1, 11-20 page 2, 21-30 page 3
        //127.0.0.1:3000/api/v1/tours?page=1&limit=3
        const page = this.queryString.page * 1 || 1;
            //req.query.page * 1 artinya convert string ke number (a trick)
            // || 1; command ini artinya by default di set ke page 1
            
        const limit = this.queryString.limit * 1 || 100;
            // || 100; by default document yg keluar berjumlah 100
                
        const skip = (page - 1) * limit;
            this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;