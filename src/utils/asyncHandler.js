export const asyncHandler = (passedFunction) => (req, res, next) => {
    Promise.resolve(passedFunction(req, res, next))
    .catch((err)=>next(err));
}
