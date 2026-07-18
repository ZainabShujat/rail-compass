import axios from 'axios';

const run = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/forgot-password', {
      email: 'yasirhasan1000@gmail.com'
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
};
run();
