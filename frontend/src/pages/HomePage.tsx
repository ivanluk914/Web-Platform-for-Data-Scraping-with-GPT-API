import Sidebar from '../components/SideBar';
import Content from '../components/Contents';

const HomePage = () => {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <Content />
    </div>
  );
};

export default HomePage;
