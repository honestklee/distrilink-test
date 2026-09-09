Lakukan Cloning pada link repository ini : https://github.com/honestklee/distrilink-test.git

Jalankan kode dibawah ini menggunakan git bash :

1. Buka Git Bash lalu ketik 'git clone (klik kanan paste link diatas)'

2. cd 'path'

3. code .

Setelah melakukan cloning pada repository lakukan langkah di bawah ini :

1. Lakukan 'npm install' pada terminal untuk melakukan instalasi dependency
note : Jika terdapat kendala pada React 19 lakukan 'npm install --legacy-peer-deps'

2. Buat file environtment pada root folder '.env.local' lalu isi dengan :
NEXT_PUBLIC_API_URL=[https://dummyjson.com](https://dummyjson.com)
NEXT_PUBLIC_API_BASE_URL=[https://dummyjson.com](https://dummyjson.com)

3. Jalankan server lokal dengan cara 'npm run dev' pada terminal

Dependencies yang digunakan :
1. Next
2. React
3. Axios
4. Lucide-react
5. js-cookies
6. Recharts

Panduan alur website :
1. Login sebagai supervisor untuk membuat account sales pada menu 'Pendaftaran Salesman'.
2. Setelah membuat account lakukan Log out terlebih dahulu dan masuk dengan account sales yang sudah dibuat sebelumnya.
3. Setelah login sebagai sales pergi ke menu 'Geotag & NOO' untuk mendaftarkan outlet di daerah tersebut.
4. Login kembali sebagai Supervisor dan Accept Request di bagian 'Meja Persetujuan Supervisi'.
5. Login kembali sebagai Sales pergi ke bagian 'Rute & Live tracking' untuk melakukan Checkin & Checkout yang mana hasil ini akan ditampilkan di Supervisor Account.
6. Login sebagai Supervisor dan lakukan Import data .csv yang sudah saya sediakan, buka menu 'Monitoring Stok Gudang & Depo' dan lakukan import data.csv disana.
7. Login sebagai Sales kembali unutk melakukan Taking Order, Retur Barang, dan Juga ketika ingin melakukan Pesanan Tanpa Kunjungan, semua fitur ini tetap harus disetujui oleh Supervisor.