(()=>{
  const requested=new URLSearchParams(location.search).get('design');
  const design=['dark','light','studio'].includes(requested)?requested:'dark';
  document.documentElement.dataset.chatDesign=design;
  // Keep the chosen preview when using the logo, ENTER DEMO or category links.
  // Delegation also covers the category links inserted by the homepage module.
  document.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');if(!link)return;
    const destination=new URL(link.href,location.href);
    if(destination.origin!==location.origin)return;
    const currentDirectory=location.pathname.slice(0,location.pathname.lastIndexOf('/')+1);
    if(![currentDirectory,currentDirectory+'index.html',currentDirectory+'demo.html'].includes(destination.pathname))return;
    destination.searchParams.set('design',design);link.href=destination.href;
  },true);
})();
