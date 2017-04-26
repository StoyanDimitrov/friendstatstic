var localStorage
// The "Block sites from setting any data" option prevents the extension
// from accessing the localStorage. Any attempt to access window.localStorage
// will raise a security exception.
try {
  localStorage = window.localStorage
} catch (e) {
  localStorage = {}
}

chrome.devtools.network.onRequestFinished.addListener(function(entry) {
  var parser = document.createElement('a')
  parser.href = entry.request.url

  if (! /forgeofempires\.com/g.test(parser.hostname)) {
    return
  }

  var hasJsonHeaders = entry.response.headers.filter(function(header) {
    return header.name === 'Content-Type' && header.value.match(/application\/json/i)
  })

  if (hasJsonHeaders.length <= 0) {
    return
  }

  entry.getContent(function(payload) {
    try {
      payload = JSON.parse(payload)
    } catch (e) {
      return
    }

    if (! (payload instanceof Array)) {
      return
    }

    payload.filter(function(item) {
      let branch = ''

      if (! item.hasOwnProperty('requestClass')) {
        return
      }

      switch (item.requestClass) {
        case 'OtherPlayerService':
          switch (item.requestMethod) {
            case 'getEventsPaginated':
              app.setEventsData(item.responseData)
              break

            case 'getFriendsList':
              branch = app.BRANCH_FRIENDS
              app.setData(item.responseData, branch)
              break

            case 'getClanMemberList':
              branch = app.BRANCH_GUILDIES
              app.setData(item.responseData, branch)
              break

            case 'getNeighborList':
              branch = app.BRANCH_NEIGHBORS
              app.setData(item.responseData, branch)
              break
          }
          break

        case 'StartupService':
          switch (item.requestMethod) {
            case 'getData':
              switch (item.responseData.settings.socialBarTab || 0) {
                case 0:
                  branch = app.BRANCH_FRIENDS
                  app.setData(item.responseData.socialbar_list, branch)
                  break

                case 1:
                  branch = app.BRANCH_GUILDIES
                  app.setData(item.responseData.socialbar_list, branch)
                  break

                case 2:
                  branch = app.BRANCH_NEIGHBORS
                  app.setData(item.responseData.socialbar_list, branch)
                  break
              }
              break
          }
          break
      }
    })
  })
})