// Roboto font
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./components/App/App";
import reportWebVitals from "./reportWebVitals";

import { Provider } from "react-redux";

import configureStore from "./store";

const params = new URLSearchParams(window.location.search);
const sid = params.get("sid");
if (sid) {
	window.localStorage.setItem("sid", sid);
	params.delete("sid");
	const search = params.toString();
	window.history.replaceState(
		null,
		"",
		`${window.location.pathname}${search ? `?${search}` : ""}${
			window.location.hash
		}`
	);
}

const store = configureStore;

ReactDOM.render(
	<Provider store={store}>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</Provider>,
	document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
