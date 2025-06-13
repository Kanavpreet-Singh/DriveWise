import { useAuth } from '../context/AuthContext';

const Catalogue = () => {
  const { user } = useAuth();

  return (
    <div>
      {user?.role === 'dealer' && (
        <button className='bg-[var(--color-yellow)] text-white px-4 py-2 rounded-md shadow-[0_2px_4px_var(--color-gray)]'>
          Add Listing
        </button>
      )}

      <h2>These are all the cars!!</h2>
    </div>
  );
};

export default Catalogue;
