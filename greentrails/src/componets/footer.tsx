import '../styles/style.css'
import React from 'react';
import Tree from './tree';

    const TreeFooter: React.FC = () => {
        return (
            <div>
                <div id='tree1'><Tree /></div>
                <div id='tree2'><Tree /></div>
                <footer>
                    <div id='road'></div>
                </footer>
                
            </div>
        )
    }
    export const Regfooter: React.FC = () => {
        return (
            <div>
                <footer>
                    {/* <div id='road'></div> */}
                </footer>
                
            </div>
        )
    }
        export const Cloudfooter: React.FC = () => {
        return (
            <TreeFooter />
        )
    }

    export default TreeFooter;