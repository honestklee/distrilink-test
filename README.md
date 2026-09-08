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