// Resource folder grouping patch
// This adds the grouping by course code functionality

(function () {
    const originalRenderResources = window.renderResources;

    window.renderResources = function (resources) {
        const container = document.getElementById('resources-list');
        if (resources.length === 0) {
            container.innerHTML = '<div class="empty-container"><p class="empty-text">No resources found. Upload one!</p></div>';
            return;
        }

        const currentUid = localStorage.getItem('kobi_atlas_uid');

        // Group by course code
        const grouped = {};
        resources.forEach(res => {
            const code = res.courseCode || 'UNCATEGORIZED';
            if (!grouped[code]) grouped[code] = [];
            grouped[code].push(res);
        });

        const sortedCourses = Object.keys(grouped).sort();

        container.innerHTML = sortedCourses.map(courseCode => {
            const courseResources = grouped[courseCode];
            const folderId = 'folder-' + courseCode.replace(/[^a-zA-Z0-9]/g, '');

            const resourcesHtml = courseResources.map(res => {
                const isOwner = res.uploadedBy === currentUid;
                let contentHtml = '';

                if (res.type === 'image') {
                    contentHtml = `<div style="margin:8px 0;cursor:pointer" onclick="openLightbox('${res.imageData}')"><img src="${res.imageData}" style="max-width:100%;border-radius:8px;max-height:200px;object-fit:cover"></div>`;
                } else if (res.type === 'file') {
                    const fileSource = res.fileUrl || res.fileData;
                    const cleanName = (res.fileName || 'Document').replace(/'/g, "\\'");
                    contentHtml = `<div style="margin:8px 0;background:#2a2a2a;padding:12px;border-radius:8px;display:flex;align-items:center;cursor:pointer;transition:background 0.2s" onclick="window.previewResource('${fileSource}', '${cleanName}', 'file')" onmouseover="this.style.background='#333'" onmouseout="this.style.background='#2a2a2a'">
                        <ion-icon name="document-text-outline" style="font-size:24px;color:var(--primary-color);margin-right:12px"></ion-icon>
                        <div style="flex:1;overflow:hidden">
                            <div style="font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:white">${res.fileName || 'Document'}</div>
                            <div style="font-size:12px;color:#999">${res.fileSize || 'File'}</div>
                        </div>
                        <button onclick="event.stopPropagation(); downloadFile('${fileSource}','${cleanName}')" style="background:none;border:none;color:var(--primary-color);cursor:pointer;padding:8px;border-radius:50%" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='none'" title="Download">
                            <ion-icon name="download-outline" style="font-size:24px"></ion-icon>
                        </button>
                    </div>`;
                } else {
                    contentHtml = `<a href="${res.link}" target="_blank" style="color:var(--primary-color);font-weight:bold;text-decoration:none;display:inline-flex;align-items:center;margin-top:4px">Open Link <ion-icon name="open-outline" style="margin-left:4px"></ion-icon></a>`;
                }

                return `<div class="stat-card" style="margin-bottom:12px;padding:16px"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="flex:1"><div style="display:flex;align-items:center;margin-bottom:8px"><span style="font-size:12px;color:#999">${new Date(res.timestamp).toLocaleDateString()}</span></div><h3 style="margin:0 0 4px 0;font-size:16px">${res.title}</h3>${res.description ? `<p style="font-size:14px;color:#ccc;margin-bottom:8px">${res.description}</p>` : ''}${contentHtml}<div style="display:flex;align-items:center;margin-top:12px">${res.uploadedByProfilePicture ? `<img src="${res.uploadedByProfilePicture}" style="width:24px;height:24px;border-radius:50%;margin-right:8px;object-fit:cover">` : '<div style="width:24px;height:24px;border-radius:50%;background:#444;margin-right:8px;display:flex;align-items:center;justify-content:center"><ion-icon name="person" style="font-size:14px;color:#ccc"></ion-icon></div>'}<div style="font-size:12px;color:#888">Shared by ${res.uploadedByName || 'Student'}</div>${isOwner ? `<button onclick="deleteResource('${res.id}','${res.uploadedBy}')" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#dc3545;display:flex;align-items:center"><ion-icon name="trash-outline"></ion-icon></button>` : ''}</div></div><div style="display:flex;flex-direction:column;align-items:center;padding-left:16px"><button onclick="voteResource('${res.id}',1)" style="background:none;border:none;cursor:pointer;padding:4px"><ion-icon name="caret-up-outline" style="font-size:24px;color:var(--primary-color)"></ion-icon></button><span style="font-weight:bold">${res.votes || 0}</span><button onclick="voteResource('${res.id}',-1)" style="background:none;border:none;cursor:pointer;padding:4px"><ion-icon name="caret-down-outline" style="font-size:24px;color:#888"></ion-icon></button></div></div></div>`;
            }).join('');

            return `<div style="margin-bottom:16px"><div onclick="let el=document.getElementById('${folderId}');let icon=document.getElementById('${folderId}-icon');el.style.display=el.style.display==='none'?'block':'none';icon.name=el.style.display==='none'?'chevron-forward':'chevron-down'" style="background:linear-gradient(135deg,var(--primary-color),#667eea);padding:12px 16px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="display:flex;align-items:center"><ion-icon name="folder" style="font-size:24px;margin-right:12px;color:white"></ion-icon><div><div style="font-weight:bold;font-size:16px;color:white">${courseCode}</div><div style="font-size:12px;color:rgba(255,255,255,0.8)">${courseResources.length} resource${courseResources.length !== 1 ? 's' : ''}</div></div></div><ion-icon id="${folderId}-icon" name="chevron-forward" style="font-size:24px;color:white"></ion-icon></div><div id="${folderId}" style="padding-left:8px;display:none">${resourcesHtml}</div></div>`;
        }).join('');
    };
})();
