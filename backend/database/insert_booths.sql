-- Insert 10 real 7-Eleven locations in Stockholm center
-- This can be run safely even if tables already exist

INSERT INTO booths (partner, place_id, lat, lng, address, availability, status, next_available_at) VALUES
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_001', 59.3293, 18.0686, 'Storgatan 1, 111 51 Stockholm', true, 'available', null),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_002', 59.3345, 18.0632, 'Drottninggatan 15, 111 51 Stockholm', true, 'available', null),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_003', 59.3318, 18.0712, 'Kungsgatan 8, 111 43 Stockholm', false, 'busy', NOW() + INTERVAL '25 minutes'),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_004', 59.3322, 18.0628, 'Vasagatan 10, 111 20 Stockholm', false, 'prebooked', NOW() + INTERVAL '45 minutes'),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_005', 59.3384, 18.0734, 'Sturegatan 8, 114 35 Stockholm', true, 'available', null),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_006', 59.3423, 18.0554, 'Sveavägen 55, 113 59 Stockholm', false, 'busy', NOW() + INTERVAL '15 minutes'),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_007', 59.3428, 18.0492, 'Odengatan 72, 113 22 Stockholm', true, 'available', null),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_008', 59.3364, 18.0701, 'Hornsgatan 12, 118 20 Stockholm', false, 'maintenance', NOW() + INTERVAL '2 hours'),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_009', 59.3303, 18.0645, 'Hamngatan 2, 111 47 Stockholm', true, 'available', null),
('7-Eleven', 'ChIJd8BlQ2BZwokRAFQEcDlJRAI_010', 59.3351, 18.0598, 'Biblioteksgatan 5, 111 46 Stockholm', false, 'busy', NOW() + INTERVAL '30 minutes')
ON CONFLICT (place_id) DO NOTHING;
