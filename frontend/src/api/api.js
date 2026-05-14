import axios from "axios";

const apiUrl = process.env.REACT_APP_API_URL || "https://ricebook-tjgu.onrender.com/";
export const hostUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;

const getStoredSid = () => {
	if (typeof window === "undefined") {
		return "";
	}

	return window.localStorage.getItem("sid") || "";
};

axios.interceptors.request.use((config) => {
	const sid = getStoredSid();
	if (sid) {
		config.headers = config.headers || {};
		config.headers.Authorization = `Bearer ${sid}`;
	}

	return config;
});

axios.interceptors.response.use((response) => {
	if (response.data && response.data.sid && typeof window !== "undefined") {
		window.localStorage.setItem("sid", response.data.sid);
	}

	return response;
});

/**
 * Login an user.
 * @param {*} username
 * @param {*} password
 * @returns
 */
export const signIn = (username, password) =>
	axios.post(
		`${hostUrl}login`,
		{ username: username, password: password },
		{ withCredentials: true }
	);

/**
 * register a user.
 * @param {*} register
 * @returns
 */
export const signUp = (register) =>
	axios.post(`${hostUrl}register`, register, { withCredentials: true });

/**
 * register a user.
 * @param {*} register
 * @returns
 */
export const signOut = () =>
	axios.put(`${hostUrl}logout`, {}, { withCredentials: true });

/**
 * get current user profile.
 * @returns
 */
export const getProfile = () =>
	axios.get(`${hostUrl}profile`, { withCredentials: true });

/**
 * update headline.
 * @returns
 */
export const putHeadline = (payload) =>
	axios.put(`${hostUrl}headline`, payload, { withCredentials: true });

/**
 * update email.
 * @returns
 */
export const putEmail = (payload) =>
	axios.put(`${hostUrl}email`, payload, { withCredentials: true });

/**
 * update zipcode.
 * @returns
 */
export const putZipcode = (payload) =>
	axios.put(`${hostUrl}zipcode`, payload, { withCredentials: true });

/**
 * update phone.
 * @returns
 */
export const putPhoneNumber = (payload) =>
	axios.put(`${hostUrl}phone`, payload, { withCredentials: true });

/**
 * update display name.
 * @returns
 */
export const putDisplayName = (payload) =>
	axios.put(`${hostUrl}displayname`, payload, { withCredentials: true });

/**
 * update password.
 * @returns
 */
export const putPassword = (payload) =>
	axios.put(`${hostUrl}password`, payload, { withCredentials: true });

/**
 * update avatar.
 * @returns
 */
export const putAvatar = (payload) =>
	axios.put(`${hostUrl}avatar`, payload, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
		withCredentials: true,
	});

/**
 * get current user feed.
 * @returns
 */
export const getArticle = () =>
	axios.get(`${hostUrl}articles`, { withCredentials: true });

/**
 * post a new article.
 * @returns
 */
export const postArticle = (payload) =>
	axios.post(`${hostUrl}article`, payload, { withCredentials: true });

/**
 * modify an article.
 * @returns
 */
export const putArticle = (postId, payload) =>
	axios.put(`${hostUrl}articles/${postId}`, payload, {
		withCredentials: true,
	});

/**
 * get comments of an article.
 * @returns
 */
export const getComments = (postId) =>
	axios.get(`${hostUrl}comment/${postId}`, { withCredentials: true });

/**
 * get followings.
 * @returns
 */
export const getFollowing = (toGet) =>
	axios.get(`${hostUrl}following/${toGet}`, { withCredentials: true });

/**
 * add a new following.
 * @returns
 */
export const addFollowing = (toAdd) =>
	axios.put(`${hostUrl}following/${toAdd}`, {}, { withCredentials: true });

/**
 * remove a following.
 * @returns
 */
export const removeFollowing = (toRemove) =>
	axios.delete(`${hostUrl}following/${toRemove}`, { withCredentials: true });

/**
 *
 * @param {*} img
 * @returns
 */
export const uploader = (img) => {
	let formdata = new FormData();
	formdata.append("image", img);
	return putAvatar(formdata);
};

/**
 *
 * @param {*} text
 * @param {*} img
 * @returns
 */
export const postImgUploader = (text, img) => {
	let formdata = new FormData();
	formdata.append("image", img);
	formdata.append("text", text);
	return postArticle(formdata);
};
