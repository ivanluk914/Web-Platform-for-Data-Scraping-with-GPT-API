import { Link, useNavigate } from 'react-router-dom';
import { Input, Checkbox, Button } from '@nextui-org/react';
import { useState } from 'react';


const SignUpPage = () => {
    const navigate = useNavigate();

    // State for form fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');
  
    const onTick = (checked: boolean) => {
        setAgree(checked);
      };
      
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
                <h2 className="text-2xl font-bold mb-6 text-start text-black">Sign Up</h2>
                <form onSubmit={handleSubmit}>
                    <Input
                        type="text"
                        label="Username *"
                        placeholder="Enter your username"
                        className="mb-4"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <Input
                        type="email"
                        label="Email Address *"
                        placeholder="Enter your email"
                        className="mb-4"                        
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        label="Password *"
                        placeholder="Enter your password"
                        className="mb-4"              
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        label="Confirm Password *"
                        placeholder="Confirm your password"
                        className="mb-4"               
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <div className="flex items-center justify-start gap-2 mb-4">
                        <Checkbox onChange={(e) => onTick(e.target.checked)}>
                        <slot className='text-black'>
                            I agree with the{' '}
                            </slot>
                        </Checkbox>
                        <div className='flex text-black gap-1'>
                            
                        <Link to="/terms" className="text-blue-500 font-bold">
                            Terms
                        </Link>{' '}
                            and{' '}
                        <Link to="/privacy" className="text-blue-500 font-bold">
                            Privacy Policy
                        </Link>
                        </div>

                    </div>
                    <Button isDisabled={!agree} color="primary" className="w-full mb-4 bg-black">
                        Sign Up
                    </Button>
                    <p className="text-center text-black">
                        Already have an account?{' '}
                        <Link to="/" className="text-blue-500 font-bold">
                            Log In
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignUpPage;
