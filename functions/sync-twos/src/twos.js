import Axios from "axios";

export const getFinishedCount = async (userId, token) => {
    const response = await Axios.post(`https://www.twosapp.com/apiV2/user/${userId}/counts`, {
        "user_id": userId,
        "token": token
    });

    const finished = response.data.counts.todos;

    return finished;
}