import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/google', {
      credential: "fake"
    });
    console.log("Success:", res.status, res.data);
  } catch (err) {
    console.log("Error status:", err.response?.status);
    console.log("Error data:", err.response?.data);
    console.log("Error message:", err.message);
  }
}

test();
