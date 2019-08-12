$(function() {
  const socket = io()

  socket.on('new post', function(data){
    if (data.station != undefined) {
      let date = moment(data.date).format('MM/DD/YYYY')
      let time = moment(data.date).format('HH:mm:ss')
      let html = `<tr>
        <td>${data.postId}</td>
        <td>${date}</td>
        <td>${time}</td>
        <td>${data.user}</td>
        <td>
          <a href="https://www.instagram.com/p/${data.postId}" target="_blank">
            <img src="${data.picture}" width="30" />
          </a>
        </td>
        <td>${data.station.name}</td>
        <td>${data.station.lat}</td>
        <td>${data.station.long}</td>
      </tr>`

      $('.posts-list tbody').prepend(html)
    }
  })
})
