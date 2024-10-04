// import { Link } from 'react-router-dom';
// import { Input, Checkbox, Button } from '@nextui-org/react';

// const LoginPage = () => {
//     return (
//         <div className="flex items-center justify-center min-h-screen bg-white">
//             <div className="border border-gray-300 rounded-lg p-8 w-full max-w-md">
//                 <h2 className="text-2xl font-bold mb-6 text-start text-black">Log In</h2>
//                 <form>
//                     <Input
//                         type="email"
//                         label="Email Address"
//                         placeholder="Enter your email"
//                         className="mb-4"
//                     />
//                     <Input
//                         type="password"
//                         label="Password"
//                         placeholder="Enter your password"
//                         className="mb-4"
//                     />
//                     <div className="flex items-center justify-between mb-4">
//                         <Checkbox>
//                             <div className='text-black'>
//                                 Remember me
//                             </div>
//                         </Checkbox>
//                         <Link to="/forgot-password" className="text-slate-500">
//                             Forgot password?
//                         </Link>
//                     </div>

//                     <Button color="primary" className="w-full mb-4 bg-black">
//                         Log In
//                     </Button>
//                     <p className="text-center flex justify-center gap-2">
//                         <div className='text-black'>
//                             Need to create an account?{' '}
//                         </div>
//                         <Link to="/signup" className="text-blue-500 font-bold">
//                             Sign Up
//                         </Link>
//                     </p>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default LoginPage;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Checkbox, Button } from '@nextui-org/react';

const LoginPage = () => {
    const navigate = useNavigate();

    // State for form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Default credentials
    const defaultEmail = 'test@test.com';
    const defaultPassword = 'password';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate credentials
        if (email === defaultEmail && password === defaultPassword) {
            // Redirect to Home Page
            navigate('/home');
        } else {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="border border-gray-300 rounded-lg p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-start text-black">Log In</h2>
                {error && (
                    <p className="mb-4 text-center text-red-500">
                        {error}
                    </p>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <Input
                            type="email"
                            label="Email"
                            placeholder="Email"
                            className="bg-white text-black"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <Input
                            type='password'
                            label="Password"
                            placeholder="Password"
                            className="bg-white text-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <Checkbox><slot className='text-black'>Remember me</slot></Checkbox>
                        <Link to="/forgot-password" className="text-black">
                            Forgot password?
                        </Link>
                    </div>
                    <Button
                        type="submit"
                        className="w-full mb-4 bg-black"
                    >
                        Log In
                    </Button>
                    <p className="text-center text-black">
                        Need to create an account?{' '}
                        <Link to="/signup" className="text-blue-500 font-bold">
                            Sign Up
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
