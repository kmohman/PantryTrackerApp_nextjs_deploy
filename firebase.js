// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHvx1mMiMSuurKol72QSIxq0lBILZKB0k",
  authDomain: "inventory-management-app-ca5ac.firebaseapp.com",
  projectId: "inventory-management-app-ca5ac",
  storageBucket: "inventory-management-app-ca5ac.appspot.com",
  messagingSenderId: "627866263291",
  appId: "1:627866263291:web:9e7e26e31ee4506eee9a5e",
  measurementId: "G-6S5H2WTKVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {firestore};