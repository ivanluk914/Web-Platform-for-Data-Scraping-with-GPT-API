import { useState } from 'react';
import { Input, Button, Avatar } from '@nextui-org/react';

const ProfilePage = () => {
  // State for form fields
  const [password, setPassword] = useState('');
  const [currentemail, setCurrentEmail] = useState('test@test.com');
  const [username, setUsername] = useState('Jane Doe')
  const [email, setEmail] = useState('test@test.com');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic
    alert('Profile updated successfully!');
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-black">Profile Dashboard</h1>
        {/* Description */}
        <p className="text-gray-900 mb-6">
          Customize settings, email preferences, and password.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Avatar and User Info */}
          <div className="flex items-center mb-6 bg-slate-100 rounded-lg p-4">
            <Avatar
              size="lg"
              className="rounded-full"
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
            />
            <div className="ml-4">
              <p className="text-lg text-black">{username}</p>
              <p className="text-slate-500">{currentemail}</p>
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <Input
              type="password"
              label="Password"
              placeholder="Enter new password"
              className="bg-white text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="Enter new email address"
              className="bg-white text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Phone Number Field */}
          <div className="mb-4">
            <Input
              type="tel"
              label="Phone Number"
              placeholder="Optional"
              className="bg-white text-black"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Home Address Field */}
          <div className="mb-6">
            <Input
              type="text"
              label="Home Address"
              placeholder="Optinoal"
              className="bg-white text-black"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Update Profile Button */}
          <Button type="submit" className="w-36 bg-black text-white">
            Update Profile
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
