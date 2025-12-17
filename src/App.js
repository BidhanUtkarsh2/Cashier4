import React, { useState, useEffect } from 'react';
import { Clock, Edit2, Trash2, X, Gamepad2, ChevronRight } from 'lucide-react';

const devicesDefault = {
  parth: {
    name: 'Parth',
    games: ['Forza Horizon', 'Fortnite', 'Grand Theft Auto 5', 'Street Fighter 6', 'Arena Breakout Infinite', 'God of War Ragnarok', 'Black Myth Wukong', 'Rust', 'Grand Theft Auto: San Andreas'],
    slots: 1,
    bookings: [],
    queue: []
  },
  atishay: {
    name: 'Atishay',
    games: ['Aimlabs', 'Apex Legends', 'Arena Breakout Infinite', 'Counterstrike 2', 'Marvel Rivals', 'Rust', 'Assetto Corsa', 'Minecraft', 'Among Us', 'Rocket League'],
    slots: 1,
    bookings: [],
    queue: []
  },
  bhavay: {
    name: 'Bhavay',
    games: ['Grand Theft Auto 5', 'Forza Horizon 5', 'Arena Breakout: Infinite', 'Black Myth Wukong', 'Batman Arkham Knight', 'Red Dead Redemption 2', 'Fortnite', 'Fall Guys', 'Grand Theft Auto: San Andreas'],
    slots: 1,
    bookings: [],
    queue: []
  },
  ally: {
    name: 'Ally',
    games: ['GTA 5', 'Forza Horizon 5', 'Beach Buggy Racing', 'Fortnite', 'Red Dead Redemption 2', 'Arena Breakout', 'Black Myth Wukong', 'Rust'],
    slots: 1,
    bookings: [],
    queue: []
  }
};

export default function CashierApp() {
  // Initialize from localStorage or default
  const [deviceStates, setDeviceStates] = useState(() => {
    try {
      const saved = localStorage.getItem('cashier_deviceStates');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert endTime strings back to dates
        Object.keys(parsed).forEach(key => {
          parsed[key].bookings = parsed[key].bookings.map(b => ({
            ...b,
            endTime: new Date(b.endTime)
          }));
        });
        return parsed;
      }
    } catch (e) {
      console.log('Error loading saved state');
    }
    return devicesDefault;
  });
  
  const [totalRevenue, setTotalRevenue] = useState(() => {
    try {
      const saved = localStorage.getItem('cashier_totalRevenue');
      return saved ? JSON.parse(saved) : 0;
    } catch {
      return 0;
    }
  });
  
  const [durations, setDurations] = useState(() => {
    try {
      const saved = localStorage.getItem('cashier_durations');
      return saved ? JSON.parse(saved) : { first: 5, second: 8 };
    } catch {
      return { first: 5, second: 8 };
    }
  });
  
  const [prices, setPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('cashier_prices');
      return saved ? JSON.parse(saved) : { first: 80, second: 150 };
    } catch {
      return { first: 80, second: 150 };
    }
  });
  
  const [editingPrice, setEditingPrice] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(null);
  const [bookingForm, setBookingForm] = useState({ customerName: '', game: '', durationIndex: 'first', specificDevice: null });
  const [pendingQueueDevice, setPendingQueueDevice] = useState(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('cashier_deviceStates', JSON.stringify(deviceStates));
    } catch (e) {
      console.log('Error saving device states');
    }
  }, [deviceStates]);

  useEffect(() => {
    try {
      localStorage.setItem('cashier_totalRevenue', JSON.stringify(totalRevenue));
    } catch (e) {
      console.log('Error saving revenue');
    }
  }, [totalRevenue]);

  useEffect(() => {
    try {
      localStorage.setItem('cashier_durations', JSON.stringify(durations));
    } catch (e) {
      console.log('Error saving durations');
    }
  }, [durations]);

  useEffect(() => {
    try {
      localStorage.setItem('cashier_prices', JSON.stringify(prices));
    } catch (e) {
      console.log('Error saving prices');
    }
  }, [prices]);

  const allGames = [...new Set(Object.values(devicesDefault).flatMap(d => d.games))].sort();

  const promoteFromQueue = (deviceKey) => {
    setDeviceStates(prev => {
      const updated = { ...prev };
      if (updated[deviceKey].queue.length > 0) {
        const nextInQueue = updated[deviceKey].queue[0];
        const endTime = new Date(Date.now() + nextInQueue.duration * 60000);
        updated[deviceKey].bookings.push({
          ...nextInQueue,
          endTime
        });
        updated[deviceKey].queue = updated[deviceKey].queue.slice(1);
        setTotalRevenue(prevRev => prevRev + nextInQueue.price);
      }
      return updated;
    });
    setPendingQueueDevice(null);
  };

  const handleBooking = () => {
    if (!bookingForm.customerName || !bookingForm.game) {
      alert('Please fill all fields');
      return;
    }

    const duration = durations[bookingForm.durationIndex];
    const price = prices[bookingForm.durationIndex];
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60000);

    let assignedDevice = bookingForm.specificDevice;

    if (assignedDevice) {
      if (!deviceStates[assignedDevice].games.some(g => g.toLowerCase() === bookingForm.game.toLowerCase())) {
        alert(`${deviceStates[assignedDevice].name} doesn't have ${bookingForm.game}!`);
        return;
      }
      
      if (deviceStates[assignedDevice].bookings.length > 0) {
        setDeviceStates(prev => ({
          ...prev,
          [assignedDevice]: {
            ...prev[assignedDevice],
            queue: [...prev[assignedDevice].queue, {
              id: Date.now(),
              customerName: bookingForm.customerName,
              game: bookingForm.game,
              duration,
              price
            }]
          }
        }));
        alert(`Added to ${deviceStates[assignedDevice].name}'s queue!`);
      } else {
        setDeviceStates(prev => ({
          ...prev,
          [assignedDevice]: {
            ...prev[assignedDevice],
            bookings: [...prev[assignedDevice].bookings, {
              id: Date.now(),
              customerName: bookingForm.customerName,
              game: bookingForm.game,
              duration,
              price,
              endTime
            }]
          }
        }));
        setTotalRevenue(prev => prev + price);
      }
    } else {
      let foundDevice = null;
      for (const [key, device] of Object.entries(deviceStates)) {
        if (device.bookings.length === 0 && device.games.some(g => g.toLowerCase() === bookingForm.game.toLowerCase())) {
          foundDevice = key;
          break;
        }
      }

      if (foundDevice) {
        setDeviceStates(prev => ({
          ...prev,
          [foundDevice]: {
            ...prev[foundDevice],
            bookings: [...prev[foundDevice].bookings, {
              id: Date.now(),
              customerName: bookingForm.customerName,
              game: bookingForm.game,
              duration,
              price,
              endTime
            }]
          }
        }));
        setTotalRevenue(prev => prev + price);
      } else {
        let queueDevice = null;
        for (const [key, device] of Object.entries(deviceStates)) {
          if (device.games.some(g => g.toLowerCase() === bookingForm.game.toLowerCase())) {
            queueDevice = key;
            break;
          }
        }

        if (queueDevice) {
          setDeviceStates(prev => ({
            ...prev,
            [queueDevice]: {
              ...prev[queueDevice],
              queue: [...prev[queueDevice].queue, {
                id: Date.now(),
                customerName: bookingForm.customerName,
                game: bookingForm.game,
                duration,
                price
              }]
            }
          }));
          alert('All devices busy! Added to queue.');
        } else {
          alert('No device has this game!');
          return;
        }
      }
    }

    setBookingForm({ customerName: '', game: '', durationIndex: 'first', specificDevice: null });
    setShowBookingModal(null);
  };

  const cancelBooking = (deviceKey, bookingId) => {
    if (window.confirm('Cancel this booking?')) {
      const booking = deviceStates[deviceKey].bookings.find(b => b.id === bookingId);
      setTotalRevenue(prev => Math.max(0, prev - booking.price));
      
      setDeviceStates(prev => {
        const updated = { ...prev };
        updated[deviceKey] = {
          ...updated[deviceKey],
          bookings: updated[deviceKey].bookings.filter(b => b.id !== bookingId)
        };
        return updated;
      });

      if (deviceStates[deviceKey].queue.length > 0) {
        setPendingQueueDevice(deviceKey);
      }
    }
  };

  const removeFromQueue = (deviceKey, queueId) => {
    setDeviceStates(prev => ({
      ...prev,
      [deviceKey]: {
        ...prev[deviceKey],
        queue: prev[deviceKey].queue.filter(q => q.id !== queueId)
      }
    }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceStates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          const expiredBookings = updated[key].bookings.filter(b => new Date() >= b.endTime);
          updated[key].bookings = updated[key].bookings.filter(b => new Date() < b.endTime);

          if (expiredBookings.length > 0 && updated[key].queue.length > 0 && updated[key].bookings.length === 0) {
            setPendingQueueDevice(key);
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRemainingTime = (endTime) => {
    const diff = Math.max(0, Math.floor((endTime - new Date()) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQueueWaitTime = (device, queueIndex) => {
    let waitTime = 0;
    if (device.bookings.length > 0) {
      const currentBooking = device.bookings[0];
      waitTime += Math.ceil((currentBooking.endTime - new Date()) / 1000 / 60);
    }
    for (let i = 0; i < queueIndex; i++) {
      waitTime += device.queue[i].duration;
    }
    return waitTime;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Gamepad2 size={40} className="text-blue-400" />
              <h1 className="text-5xl font-black tracking-tight">ICEMIRE</h1>
            </div>
            <p className="text-slate-400 text-sm font-medium">Cashier - Bhavay</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Total Revenue</p>
            <p className="text-5xl font-black text-emerald-400">₹{totalRevenue}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Book Session Button & Settings */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            + New Gaming Session
          </button>
          <button
            onClick={() => setEditingPrice('menu')}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            <Edit2 size={20} /> Settings
          </button>
        </div>

        {/* Device Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(deviceStates).map(([key, device]) => (
            <div key={key} className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600 overflow-hidden hover:border-slate-500 transition-all flex flex-col">
              {/* Device Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                <h3 className="text-xl font-black">{device.name}</h3>
              </div>

              {/* Current Booking */}
              <div className="p-4 flex-1 flex flex-col overflow-y-auto">
                {device.bookings.length > 0 ? (
                  <div>
                    <div className="mb-3 pb-3 border-b border-slate-600">
                      {device.bookings.map((booking) => (
                        <div key={booking.id} className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-emerald-500">
                          <p className="font-bold text-white">{booking.customerName}</p>
                          <p className="text-emerald-300 text-sm font-bold mt-1">{booking.game}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-slate-400 text-xs">
                              {booking.duration} min • ₹{booking.price}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold text-sm">
                              {getRemainingTime(booking.endTime)}
                            </span>
                          </div>
                          <button
                            onMouseDown={() => cancelBooking(key, booking.id)}
                            className="w-full mt-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs font-bold py-1 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Queue for this device */}
                    {device.queue.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-2">QUEUE ({device.queue.length})</p>
                        <div className="space-y-2">
                          {device.queue.map((queueItem, idx) => {
                            const waitTime = getQueueWaitTime(device, idx);
                            
                            return (
                              <div key={queueItem.id} className="bg-slate-700/50 rounded-lg p-2 border-l-2 border-yellow-500">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1">
                                    <p className="font-bold text-white text-sm">#{idx + 1} {queueItem.customerName}</p>
                                    <p className="text-yellow-300 text-xs mt-1">{queueItem.game}</p>
                                    <p className="text-slate-400 text-xs mt-1">{queueItem.duration} min • ₹{queueItem.price}</p>
                                    <p className="text-orange-400 text-xs font-bold mt-1">Wait: ~{waitTime} min</p>
                                  </div>
                                  <button
                                    onClick={() => removeFromQueue(key, queueItem.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 pt-1"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm text-center py-6">Available</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Queue Promotion Modal */}
      {pendingQueueDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full border border-slate-700">
            <div className="mb-6">
              <h3 className="text-2xl font-black mb-2">{deviceStates[pendingQueueDevice].name} is Free!</h3>
              <p className="text-slate-300">What would you like to do?</p>
            </div>

            {/* Queue Preview */}
            {deviceStates[pendingQueueDevice].queue.length > 0 && (
              <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
                <p className="text-xs font-bold text-slate-400 mb-3">Next in Queue:</p>
                <div className="bg-slate-800/50 rounded-lg p-3 border-l-2 border-yellow-500">
                  <p className="font-bold text-white">{deviceStates[pendingQueueDevice].queue[0].customerName}</p>
                  <p className="text-yellow-300 text-sm font-bold mt-1">{deviceStates[pendingQueueDevice].queue[0].game}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {deviceStates[pendingQueueDevice].queue[0].duration} min • ₹{deviceStates[pendingQueueDevice].queue[0].price}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onMouseDown={() => promoteFromQueue(pendingQueueDevice)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ChevronRight size={20} />
                Start Queue Member
              </button>
              <button
                onMouseDown={() => {
                  setShowBookingModal(true);
                  setPendingQueueDevice(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-lg transition-colors"
              >
                + New Booking
              </button>
              <button
                onClick={() => setPendingQueueDevice(null)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition-colors text-sm"
              >
                Skip for Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">New Session</h3>
              <button
                onClick={() => setShowBookingModal(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({...bookingForm, customerName: e.target.value})}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="Enter name"
                />
              </div>

              {/* Game Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Game</label>
                <select
                  value={bookingForm.game}
                  onChange={(e) => setBookingForm({...bookingForm, game: e.target.value})}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="">Select a game...</option>
                  {allGames.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onMouseDown={() => setBookingForm({...bookingForm, durationIndex: 'first'})}
                    className={`py-3 rounded-lg font-black transition-all ${
                      bookingForm.durationIndex === 'first'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {durations.first} min (₹{prices.first})
                  </button>
                  <button
                    onMouseDown={() => setBookingForm({...bookingForm, durationIndex: 'second'})}
                    className={`py-3 rounded-lg font-black transition-all ${
                      bookingForm.durationIndex === 'second'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {durations.second} min (₹{prices.second})
                  </button>
                </div>
              </div>

              {/* Device Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Device (Optional)</label>
                <select
                  value={bookingForm.specificDevice || ''}
                  onChange={(e) => setBookingForm({...bookingForm, specificDevice: e.target.value || null})}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="">Auto-assign (Any available)</option>
                  {Object.entries(deviceStates).map(([key, device]) => (
                    <option key={key} value={key}>
                      {device.name} ({device.bookings.length === 0 ? 'Available' : `Queue: ${device.queue.length}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Display */}
              <div className="bg-emerald-600/20 border border-emerald-600 rounded-lg p-3">
                <p className="text-sm text-slate-300 mb-1">Total Price</p>
                <p className="text-3xl font-black text-emerald-400">₹{prices[bookingForm.durationIndex]}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onMouseDown={handleBooking}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-lg transition-colors"
              >
                Confirm Booking
              </button>
              <button
                onClick={() => setShowBookingModal(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {editingPrice === 'menu' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black">Settings</h3>
              <button
                onClick={() => setEditingPrice(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* First Option */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h4 className="font-black text-blue-400 mb-4">Option 1</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={durations.first}
                    onChange={(e) => setDurations({...durations, first: Math.max(1, Number(e.target.value))})}
                    className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={prices.first}
                    onChange={(e) => setPrices({...prices, first: Math.max(0, Number(e.target.value))})}
                    className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Second Option */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h4 className="font-black text-purple-400 mb-4">Option 2</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={durations.second}
                    onChange={(e) => setDurations({...durations, second: Math.max(1, Number(e.target.value))})}
                    className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={prices.second}
                    onChange={(e) => setPrices({...prices, second: Math.max(0, Number(e.target.value))})}
                    className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingPrice(null)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingPrice(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}