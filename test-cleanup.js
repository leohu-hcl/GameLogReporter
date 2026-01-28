const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sessions/admin/close-inactive',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzk2MWQzNTEyNTE1ZWU0YjkwYWZiZDkiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM4MDI4NzgwLCJleHAiOjE3Mzg2MzM1ODB9.1sBdZPvCrGvz5DXMdwL09MXZWMWEmpHwX_f0y05I5Co'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', data);
    try {
      const result = JSON.parse(data);
      console.log(`\n已关闭 ${result.data?.closedCount || 0} 个不活跃的会话`);
    } catch (e) {
      // ignore
    }
  });
});

req.on('error', (error) => {
  console.error('错误:', error);
});

req.end();
