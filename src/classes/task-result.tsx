///Represents the result of a task
class TaskResult {
    Succeeded: boolean;
    Message: string;
    Result: any;


    ///Initializes a new task result
    constructor(succeeded: boolean, message: string, result: any) {
        this.Succeeded = succeeded;
        this.Message = message;
        this.Result = result;
    }
}

export default TaskResult;